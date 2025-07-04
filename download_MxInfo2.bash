#!/bin/bash
#h-------------------------------------------------------------------------------
#h
#h Name:         download_MxInfo2.bash
#h Type:         Linux shell script
#h Purpose:      download the MxInfo2 package from Github and copy it to the 
#h               Z-Way folder userModules
#h Project:      
#h Usage:        <path>/download_MxInfo2.bash
#h               or with wget:
#h               url=https://github.com/piet66-peb/ZWay-MxInfo2/raw/refs/heads/main/download_MxInfo2.bash
#h               cd /tmp; wget -q -O - $url | bash
#h Result:       
#h Examples:     
#h Outline:      
#h Resources:    
#h Platforms:    Linux
#h Authors:      peb piet66
#h Version:      V1.1.0 2025-06-16/peb
#v History:      V1.0.0 2024-10-02/peb first version
#h Copyright:    (C) piet66 2024
#h
#h-------------------------------------------------------------------------------

#b Constants
#-----------
MODULE='download_MxInfo2.bash'
VERSION='V1.1.0'
WRITTEN='2025-06-16/peb'

#b Variables
#-----------
pack=MxInfo2

gitpack=ZWay-$pack
url=https://github.com/piet66-peb/$gitpack/archive/refs/heads/main.zip
gitzip=$gitpack.zip
module=${gitpack}-main/${pack}
tardir=/opt/z-way-server/automation/userModules/
tmp=/tmp

#b Commands
#----------
set -e  # exit if any command fails

echo cd $tmp...
pushd $tmp >/dev/null

echo downloading $gitzip...
[ -e "$gitzip" ] && rm $gitzip
wget -nv -O $gitzip $url

echo extracting $gitzip...
[ -e "$module" ] && rm -R $module
unzip -q -o $gitzip

echo copying $pack to $tardir...
cp -dpR $module $tardir

echo done.
popd >/dev/null

