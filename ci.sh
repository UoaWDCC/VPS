#!/bin/sh

# Other CI tools are not working for the following reasons: 
# - GitHub classroom's GitHub Actions ran out of time
# - Other tool such as circleCI and TravisCI requires GitHub write scope permission (need admin rights)

# Preparing for the CI pipeline
export CI=true
error_detected=false

# Running CI for frontend
echo "======================================"
echo "=========Starting Frontend CI========="
echo "======================================"
cd ./frontend
echo ""
echo "---------------------------------"
echo "        Frontend Linting "
npm run lint
if [ $? -ne 0 ] ; then
  error_detected=true;
fi
echo "---------------------------------"
echo " "
echo "---------------------------------"
echo "         Frontend Prettier "
npm run prettier
if [ $? -ne 0 ] ; then
  error_detected=true
fi
echo "---------------------------------"
echo " "
echo "---------------------------------"
echo "          Frontend Tests "
yarn test
if [ $? -ne 0 ] ; then
  error_detected=true
fi
echo "---------------------------------"
if [ "$error_detected" = true ] ; then
  echo "......SOMETHING FAILED...."
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!"
else
  echo "......All Passed.....\n"
fi
read -p "Press any key to run CI for backend..."
echo "======================================="
echo " "
clear

error_detected=false
# Running CI for backend
echo "======================================"
echo "===========Starting Backend CI========"
echo "======================================"
cd ../backend
echo ""
echo "---------------------------------"
echo "        Backend Linting "
npm run lint
if [ $? -ne 0 ] ; then
  error_detected=true;
fi
echo "---------------------------------"
echo " "
echo "---------------------------------"
echo "         Backend Prettier "
npm run prettier
if [ $? -ne 0 ] ; then
  error_detected=true
fi
echo "---------------------------------"
echo " "
echo "---------------------------------"
echo "          Backend Tests "
yarn test
if [ $? -ne 0 ] ; then
  error_detected=true
fi
echo "---------------------------------"
if [ "$error_detected" = true ] ; then
  echo "......SOMETHING FAILED...."
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!"
else
  echo "......All Passed.....\n"
fi
echo "======================================="
read -p "Press any key to quit... "
