# Image Dehaze

## Installing Dependencies

### Backend

1. Navigate to the backend directory:
  ```sh
  cd backend
  ```

2. (Optional) Setup a virtual environment:
  ```sh
  python -m venv .venv
  ```

3. Activate the virtual environment:
  - For bash:
    ```sh
    source .venv/bin/activate
    ```
  - For Windows cmd.exe:
    ```sh
    .venv\Scripts\activate.bat
    ```

4. Install the required dependencies:
  ```sh
  pip install -r requirements.txt
  ```

### Frontend Web UI

1. Install the latest Angular version:
  ```sh
  npm install -g @angular/cli@latest
  ```

2. Navigate to the frontend directory and install dependencies:
  ```sh
  cd frontend
  npm install
  ```

## Running the Project

### Backend

1. Navigate to the backend directory:
  ```sh
  cd backend
  ```

2. Start the FastAPI server:
  ```sh
  fastapi dev main.py
  ```

### Frontend Web UI

1. Navigate to the frontend directory:
  ```sh
  cd frontend
  ```

2. Start the Angular development server:
  ```sh
  npm run start
  ```
