@echo off

echo Installing root dependencies...
call npm install

echo Installing dependencies for all services...

echo Admin Server...
cd adminserver/backend
call npm install
cd ../..

echo Chat Server...
cd chatserver
call npm install
cd ..

echo Client...
cd client
call npm install
cd ..

echo Login Server...
cd loginserver/backend
call npm install
cd ../..

echo Student Server...
cd studentserver/backend
call npm install
cd ../..

echo SuperAdmin Server...
cd superadmin/backend
call npm install
cd ../..

echo All installations completed!
echo.
set /p run=Do you want to start the servers now? (y/n): 
if /I "%run%"=="y" (
    npm run dev
)
pause