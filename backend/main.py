from typing import Annotated
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import Response, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dehaze import dehaze
from PIL import Image
import numpy as np
from uuid import uuid4
import matplotlib.pyplot as plt
import os

app = FastAPI()

origins = [
  "http://localhost:4200",
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

@app.post("/dehaze")
def read_root(image: UploadFile, auto: Annotated[bool, Form()], r: Annotated[int, Form()], beta: Annotated[float, Form()], gfr: Annotated[int, Form()], stages: Annotated[bool, Form()]):
  original = np.asarray(Image.open(image.file))
  dehazed, _, _, region, refinedRegion, transmission, atmospheric, r, beta, gf_r = dehaze(original, auto, r, beta, gfr, gf_eps=0.001)
  dehazedImg = Image.fromarray(dehazed)
  uuid = uuid4()
  dehazedFilename = f"{uuid}.png"
  dehazedImg.save(f'temp/{dehazedFilename}')
  if not stages:
    return {'dehazed': dehazedFilename, 'r': r, 'beta': beta, 'gfr': gf_r}
  if stages:
    regionScaled = normalize255(region)
    refinedRegionScaled = normalize255(refinedRegion)
    transmissionScaled = normalize255(transmission)
    atmosphericScaled = normalize255(atmospheric)
    regionImg = Image.fromarray(regionScaled)
    refinedRegionImg = Image.fromarray(refinedRegionScaled)
    transmissionImg = Image.fromarray(transmissionScaled)
    atmosphericImg = Image.fromarray(atmosphericScaled)
    regionFilename = f"{uuid}_region.png"
    refinedRegionFilename = f"{uuid}_refinedRegion.png"
    transmissionFilename = f"{uuid}_transmission.png"
    atmosphericFilename = f"{uuid}_atmospheric.png"
    regionImg.convert('RGB').save(f'temp/{regionFilename}')
    refinedRegionImg.convert('RGB').save(f'temp/{refinedRegionFilename}')
    transmissionImg.convert('RGB').save(f'temp/{transmissionFilename}')
    atmosphericImg.save(f'temp/{atmosphericFilename}')
    return {
      'dehazed': dehazedFilename,
      'region': regionFilename,
      'refinedRegion': refinedRegionFilename,
      'transmission': transmissionFilename,
      'atmospheric': atmosphericFilename,
      'r': r,
      'beta': beta,
      'gfr': gf_r
    }

@app.get("/{img_name}",
  responses = {
    200: {
      "content": {"image/png": {}}
    }
  },
  response_class=FileResponse)
def get_image(img_name: str):
  filename = f"temp/{img_name}"
  if not os.path.isfile(filename):
    return Response(status_code=404)
  return FileResponse(filename)

def normalize255(arr):
  return ((arr - arr.min()) / (arr.max() - arr.min()) * 255).astype(np.uint8)