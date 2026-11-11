@echo off
title BANKAI - 3D Solar Odyssey
echo Starting BANKAI...
if not exist node_modules (
  echo Run npm install first.
)
start "" http://localhost:5500
npm run dev
