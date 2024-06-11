import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from dehaze import dehaze

def main():
  dehazed, original, depth, region, refined_region, transmission, atmospheric =  dehaze('images/brick.jpg', gf_r=30, r=10, beta=1.0)

  fig, axs = plt.subplots(2, 3)
  axs[0, 0].imshow(original)
  axs[0, 1].imshow(region)
  axs[0, 2].imshow(refined_region)
  axs[1, 0].imshow(transmission)
  axs[1, 1].imshow(atmospheric)
  axs[1, 2].imshow(dehazed)
  fig, axs = plt.subplots(1, 2)
  axs[0].imshow(original)
  axs[1].imshow(dehazed)
  plt.show()


if __name__ == '__main__':
  main()
