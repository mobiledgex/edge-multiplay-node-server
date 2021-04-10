#!/bin/sh

while getopts v: flag
do
    case "${flag}" in
        v) version=${OPTARG};;
    esac
done

# include parse_yaml function
. parse_yaml.sh

# read yaml file
eval $(parse_yaml config.yml "config_")

# export vars from config.yml
export region=$config_app_region
export app_name=$config_app_appName
export app_version=$version
export developer_org=$config_app_developerOrg
export image_path=$config_app_imagePath
export image_type=$config_app_imageType
export deployment_type=$config_app_deploymentType
export flavor_name=$config_app_flavorName
export access_ports=$config_app_accessPorts
export cluster_name=$config_app_clusterName
export cloudlet_name=$config_app_cloudletName
export operator_org=$config_app_operatorOrg

# create app.yml from app-template
rm -f temp.yml app.yml
touch temp.yml
touch app.yml
( echo "cat <<EOF >app.yml";
  cat app-template.yml;
  echo "EOF";
) >temp.yml
. temp.yml
rm -f temp.yml
cat app.yml

# create appinsts.yml from appinsts-template
rm -f appinsts.yml 
touch temp.yml
touch appinsts.yml
( echo "cat <<EOF >appinsts.yml";
  cat appinsts-template.yml;
  echo "EOF";
) >temp.yml
. temp.yml
rm -f temp.yml
cat appinsts.yml
