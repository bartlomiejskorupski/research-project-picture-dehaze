import numpy as np
from PIL import Image
import scipy.ndimage

from cv2 import Mat
from cv2.ximgproc import guidedFilter

def dehaze(filename, r = 15, beta = 1.0, gf_r = 60, gf_eps = 0.001):
  img = Image.open(filename)
  img_arr = np.asarray(img)
  img_scaled = img_arr / 255.0

  # Convert to HSV
  img_hsv = img.convert('HSV')
  hsv_arr = np.asarray(img_hsv)

  # Estimated deph coefficients
  theta_0 = 0.121779
  theta_1 = 0.95971
  theta_2 = -0.780245
  deviation = 0.041337

  # HSV saturation and value
  s_arr = hsv_arr[:, :, 1] / 255.0
  v_arr = hsv_arr[:, :, 2] / 255.0

  noise_arr = np.random.normal(0, deviation, (hsv_arr.shape[0], hsv_arr.shape[1]))

  depth = theta_0 + theta_1 * v_arr + theta_2 * s_arr + noise_arr
  region = scipy.ndimage.minimum_filter(depth, (r, r))

  refined_region = guidedFilter(img_arr.astype(np.float32), region.astype(np.float32), gf_r, gf_eps)

  tR_region = np.exp(-beta * region)
  tR = np.exp(-beta * refined_region)
  tP = np.exp(-beta * depth)

  A, atmospheric_light = estimateA(np.copy(img_scaled), region)
  print('Attenuation:', A[0])

  dehazed_scaled = np.copy(img_scaled)

  t = tR.clip(.1, .9)

  for i in range(3):
    dehazed_scaled[:, :, i] = ((dehazed_scaled[:, :, i] - A[0, i]) / t) + A[0, i]

  dehazed_img = (dehazed_scaled * 255).clip(0, 255).astype(np.uint8)

  return dehazed_img, img_arr, depth, region, refined_region, tR, atmospheric_light



def estimateA(img, Jdark):
  h, w, _ = img.shape
  n_bright = int(np.ceil(0.001*h*w))
  reshaped_JDark = Jdark.reshape(1, -1)
  Loc = np.argsort(reshaped_JDark)

  # column-stacked version of I
  Ics = img.reshape(1, h*w, 3)
  ix = img.copy()

  # init a matrix to store candidate airlight pixels
  Acand = np.zeros((1, n_bright, 3), dtype=np.float32)
  # init matrix to store largest norm arilight
  Amag = np.zeros((1, n_bright, 1), dtype=np.float32)
  
  # Compute magnitudes of RGB vectors of A
  for i in range(n_bright):
    x = Loc[0,h*w-1-i]
    ix[x//w, x%w, 0] = 0
    ix[x//w, x%w, 1] = 0
    ix[x//w, x%w, 2] = 1
    
    Acand[0, i, :] = Ics[0, Loc[0, h*w-1-i], :]
    Amag[0, i] = np.linalg.norm(Acand[0,i,:])
  
  # Sort A magnitudes
  reshaped_Amag = Amag.reshape(1,-1)
  Y2 = np.sort(reshaped_Amag) 
  Loc2 = np.argsort(reshaped_Amag)
  # A now stores the best estimate of the airlight
  if len(Y2) > 20:
    A = Acand[0, Loc2[0, n_bright-19:n_bright],:]
  else:
    A = Acand[0, Loc2[0,n_bright-len(Y2):n_bright],:]

  return A, ix