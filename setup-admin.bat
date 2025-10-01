@echo off
echo Setting up Admin Dashboard Backend...
echo.

cd backend

echo Step 1: Creating admin tracking tables...
python create_admin_tables.py

echo.
echo Step 2: Seeding demo admin data...
python seed_admin_data.py

echo.
echo Setup complete! Admin dashboard backend is ready.
echo.
echo Default Super Admin Login:
echo Email: SwoetPhethan@gmail.com
echo Password: Swoet@Phethan@14202005
echo.
pause
