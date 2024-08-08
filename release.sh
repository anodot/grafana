#! /bin/bash
# Function to get version from package.json
get_version_from_package_json() {
  jq -r '.version' package.json
}

# Get version from argument or package.json
VERSION=$1
if [ -z "$VERSION" ]; then
  VERSION=$(get_version_from_package_json)
fi

# Check if version is still empty
if [ -z "$VERSION" ]; then
  echo "Error: Version is not specified and could not be found in package.json"
  exit 1
fi

rm -rf dist
mage -v
npm run build
# export GRAFANA_ACCESS_POLICY_TOKEN=<Your token>
npx @grafana/sign-plugin@latest
mv dist/ anodot-datasource
zip anodot-datasource-$VERSION.zip anodot-datasource -r
md5 anodot-datasource-$VERSION.zip> md5Checksum.txt
mv anodot-datasource dist
npx -y @grafana/plugin-validator@latest anodot-datasource-$VERSION.zip
