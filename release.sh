#! /bin/bash
mv anodot-datasource dist
yarn build
# export GRAFANA_API_KEY=<Your Grafana Api key>
npx @grafana/toolkit plugin:sign
mv dist/ anodot-datasource
zip anodot-datasource-1.0.3.zip anodot-datasource -r
md5 anodot-datasource-1.0.3.zip> md5Checksum.txt
mv anodot-datasource dist




