import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from dehaze import dehaze
from guizero import App, PushButton, select_file, Picture, Box, Slider, Text

MAX_PICTURE_HEIGHT = 700
MAX_PICTURE_WIDTH = 700

def calculate_picture_w_h(w, h):
  width, height = None, None
  if h > w:
    ratio = MAX_PICTURE_HEIGHT / h
    width = int(ratio * w)
    height = MAX_PICTURE_HEIGHT
  else:
    ratio = MAX_PICTURE_WIDTH / w
    height = int(ratio * h)
    width = MAX_PICTURE_WIDTH
  return width, height


original_picture_widget = None
dehazed_picture_widget = None

original_image_path = None

r = 15
guided_filter_r = 60
guided_filter_eps = 0.001
beta_int = 100

def r_slider_change(val):
  global r
  r = int(val)
  process_original_image()


def gf_r_slider_change(val):
  global guided_filter_r
  guided_filter_r = int(val)
  process_original_image()


def beta_slider_change(val):
  global beta_int
  beta_int = int(val)
  process_original_image()


def process_original_image():
  if original_image_path is None or original_image_path == '':
    print('No image chosen')
    return
  
  img = Image.open(original_image_path)
  img = np.asarray(img)
  dehazed, original, *_ =  dehaze(img, r, beta_int/100.0, guided_filter_r, guided_filter_eps)
  o_img = Image.fromarray(original)

  w, h = calculate_picture_w_h(o_img.width, o_img.height)
  
  original_picture_widget.width = w
  original_picture_widget.height = h
  original_picture_widget.image = o_img

  dehazed_picture_widget.width = w
  dehazed_picture_widget.height = h
  dehazed_picture_widget.image = Image.fromarray(dehazed)


def select_file_btn_click():
  global original_image_path, original_picture_widget, dehazed_picture_widget

  filepath = select_file('Select an image...', filetypes=[['JPEG', '*.jpg']], folder='images')
  original_image_path = filepath

  process_original_image()

  

def main():
  global original_picture_widget, dehazed_picture_widget

  app = App('Picture Dehaze', width=1000, height=500)

  content_area = Box(app, align='left', height='fill', width='fill')
  right_panel = Box(app, align='left', height='fill', width=200)

  original_picture_widget = Picture(content_area, height=MAX_PICTURE_HEIGHT, align='left')
  dehazed_picture_widget = Picture(content_area, height=MAX_PICTURE_HEIGHT, align='right')
  
  select_file_btn = PushButton(right_panel, select_file_btn_click, text='Select image...')

  Text(right_panel, 'R')
  r_slider = Slider(right_panel, start=3, end=39, command=r_slider_change)
  r_slider.value = r

  Text(right_panel, 'Beta')
  beta_slider = Slider(right_panel, start=1, end=200, command=beta_slider_change)
  beta_slider.value = beta_int

  Text(right_panel, 'Guided Filter R')
  gf_r_slider = Slider(right_panel, start=3, end=150, command=gf_r_slider_change)
  gf_r_slider.value = guided_filter_r

  PushButton(right_panel, show_all_stages, text='Show all stages')

  app.display()



def show_all_stages():
  img = Image.open(original_image_path)
  img = np.asarray(img)
  dehazed, original, depth, region, refined_region, transmission, atmospheric =  dehaze(img, gf_r=30, r=10, beta=1.0)

  fig, axs = plt.subplots(2, 3)
  axs[0, 0].imshow(original)
  axs[0, 0].set_title('Original')
  axs[0, 1].imshow(region)
  axs[0, 1].set_title('Region')
  axs[0, 2].imshow(refined_region)
  axs[0, 2].set_title('Refined region')
  axs[1, 0].imshow(transmission)
  axs[1, 0].set_title('Transmission')
  axs[1, 1].imshow(atmospheric)
  axs[1, 1].set_title('Atmospheric')
  axs[1, 2].imshow(dehazed)
  axs[1, 2].set_title('Dehazed')

  # fig, axs = plt.subplots(1, 2)
  # axs[0].imshow(original)
  # axs[1].imshow(dehazed)
  plt.show()


if __name__ == '__main__':
  main()
