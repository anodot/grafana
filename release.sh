#! /bin/bash
rm -rf dist
mage -v
npm run build
# export GRAFANA_ACCESS_POLICY_TOKEN=<Your token>
npx @grafana/sign-plugin@latest
mv dist/ anodot-datasource
zip anodot-datasource-1.0.3.zip anodot-datasource -r
md5 anodot-datasource-1.0.3.zip> md5Checksum.txt
mv anodot-datasource dist
