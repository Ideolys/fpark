echo "Install Fpark"
echo "Get binary..."
# Get package version
PACKAGE_VERSION=$(
  curl  -s 'https://raw.githubusercontent.com/Ideolys/fpark/master/package.json' \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

echo "... found version ${PACKAGE_VERSION}"

curl -LJOs https://github.com/Ideolys/fpark/releases/download/v${PACKAGE_VERSION}/build.tar.gz
echo "Get binary...OK"

echo "Set Fpark directory..."
mkdir /var/www/fpark
mkdir /var/www/fpark/bin
sudo adduser fpark --no-create-home --disabled-password --system --group
sudo chown -R fpark:fpark /var/www/fpark
fpark tar -xzf build.tar.gz -C /var/www/fpark
curl -s https://raw.githubusercontent.com/Ideolys/fpark/v{PACKAGE_VERSION}/src/config.json > /var/www/fpark/fpark.config.json
echo "Set Fpark directory...OK"

echo "Register service..."
curl -s https://raw.githubusercontent.com/Ideolys/fpark/v{PACKAGE_VERSION}/systemd > /etc/systemd/system/fpark.service
sudo systemctl daemon-reload > /dev/null 2>&1
sudo systemctl enable fpark
echo "Register service...OK"

echo "Installation done ! Run 'sudo systemctl start fpark' to launch Fpark"
