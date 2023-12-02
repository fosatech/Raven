
# STK Sweep Development Setup Instructions

This README provides detailed instructions on how to set up the STK Sweep development environment. Follow these steps to get started.

## Prerequisites

Before proceeding, ensure you have the following installed on your system:
- Python 3
- `pip` (Python package manager)
- `unzip` utility

## Installation and Setup

1. **Unzip the Source Code:**
   Unzip the `SDR-STK-dev.zip` file to extract the source code.
   ```bash
   unzip SDR-STK-dev.zip
   ```

2. **Navigate to the Project Directory:**
   Change your current directory to the `SDR-STK-dev` folder.
   ```bash
   cd SDR-STK-dev/
   ```

3. **Create a Python Virtual Environment:**
   Set up a Python virtual environment to manage dependencies.
   ```bash
   python3 -m venv venv
   ```

4. **Activate the Virtual Environment:**
   Activate the newly created virtual environment.
   ```bash
   source venv/bin/activate
   ```

5. **Install Dependencies:**
   Install the required Python packages using `pip`.
   ```bash
   python -m pip install -r requirements.txt
   ```

6. **Run the Flask Application:**
   Start the Flask application.
   ```bash
   python stk_sweep.py
   ```

## Usage

After completing the setup, the Flask application will be running on your local server. You can access it via `localhost:5000/rtl_data`.

## Support

For any issues or questions, please refer to the project's documentation or contact the support team.

## Contributing

Contributions to the SDR-STK project are welcome. Please read the `CONTRIBUTING.md` file for guidelines on how to contribute.

## To-Do

**Bug Fixes:**
- Frontend breaks with really wide scan
- Buttons don't turn red on `stop`
- Exception catches on backend
- Large `bin` size breaks `drawRow()` in `rtlDataDisplay.js`

**Aditional Features:**
- Custom wideband backend
- Zoom and scroll relative to pagecenter/mouse cursor

---

Thank you for participating in the SDR-STK project development.
