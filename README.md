# Journo - Smart Mobility Analytics Platform

Journo is a comprehensive smart mobility analytics platform designed to collect, analyze, and visualize travel and mobility data. The application provides insights into travel patterns, environmental impact, and cost analysis for smarter urban planning and personal mobility management.

## Tech Stack

### Frontend

-   **Framework**: HTML5, CSS3, JavaScript (ES6+)
-   **UI Components**: Custom CSS with responsive design
-   **Charts & Visualizations**: Chart.js, jsPDF
-   **Maps**: Google Maps API, leaflyt
-   **Icons**: Boxicons
-   **Fonts**: Google Fonts (Inter)

### Backend

-   **Framework**: Python with Flask
-   **Database**: SQLAlchemy ORM with MySQL
-   **API**: RESTful API endpoints
-   **Authentication**: JWT (JSON Web Tokens)
-   **Data Processing**: Pandas, NumPy



## Features

### Dashboard Pages

-   **Dashboard**: The central hub of the application, displaying key metrics such as total users, trip logs, and data points. It provides quick access to all major features and a high-level overview of the system's activity.
-   **Trip Detection**: This page allows for the automatic detection and logging of user trips. It features real-time trip tracking, automatic mode of transport detection, and an interactive map to visualize trip history and details.
-   **Manual Trip Entry**: For trips that are not automatically detected, this page provides a form for users to manually log their travel details, including origin, destination, mode of transport, and duration.
-   **Context Awareness**: This feature helps to understand the context of user mobility patterns by providing location-based context detection, activity recognition, and analysis of environmental factors.
-   **Heatmap Visualization**: This page offers a visual representation of travel density and patterns through interactive heatmaps. It allows for time-based filtering and mode-specific visualizations to identify high-density areas.
-   **Data Insights**: A detailed analytics page that provides in-depth visualizations of travel time, CO₂ emissions, cost analysis, and mode distribution, with options for custom date range filtering.
-   **ML Predictions**: This page showcases the platform's predictive analytics capabilities, including travel time predictions, route optimization suggestions, and future trend analysis.
-   **Reports**: Users can generate comprehensive reports on travel summaries, CO₂ emissions, and cost analysis. These reports can be exported to PDF for offline viewing and sharing.

## Setup and Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd SIH
    ```
2.  **Set up the backend**:
    ```bash
    cd backend
    python -m venv venv
    # On Windows
    venv\Scripts\activate
    # On macOS/Linux
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  **Configure environment variables**: Create a `.env` file in the `backend` directory and populate it using the `.env.template` as a guide.
4.  **Run the application**:
    ```bash
    python app.py
    ```
    The backend will be available at `http://localhost:5000`.

## 🗄️ Database Schema

- **users** (`id`, `username`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `is_active`, `created_at`, `updated_at`)
- **trips** (`id`, `user_id`, `start_time`, `end_time`, `start_lat`, `start_lng`, `end_lat`, `end_lng`, `start_address`, `end_address`, `distance_km`, `duration_minutes`, `mode`, `mode_confidence`, `co2_kg`, `cost_usd`, `is_manual`, `notes`, `created_at`, `updated_at`)
- **manual_trip** (`id`, `user_id`, `start_time`, `end_time`, `start_lat`, `start_lng`, `end_lat`, `end_lng`, `start_address`, `end_address`, `distance_km`, `duration_minutes`, `mode`, `co2_kg`, `cost_usd`, `notes`, `created_at`)
- **trip_points** (`id`, `trip_id`, `latitude`, `longitude`, `altitude`, `accuracy`, `speed`, `heading`, `timestamp`)
- **ml_predictions** (`id`, `start_time`, `end_time`, `date`, `start_hour`, `mode`, `place_id`, `dest_lat_approx`, `dest_lon_approx`, `peak_by_mode_visit`, `uniq_users`, `avg_starthour`, `dow`, `rank_value`, `source_area`, `created_at`)

## API Documentation

A summary of the available API endpoints can be found below. For a detailed description of each endpoint, please refer to the API documentation.

-   `/api/users`: User registration and management.
-   `/api/trips`: Trip creation, retrieval, and management.
-   `/api/analytics`: Endpoints for data insights, heatmaps, and reports.
-   `/api/ml`: Machine learning predictions and analysis.

## Contributors
• Kanha gupta
• Mihika Arora
• Rahul Shekhawat
• Pavneet Thind
• Nausheen

## Images
<img width="1910" height="973" alt="image" src="https://github.com/user-attachments/assets/da5e23f3-9495-4dfb-8fa5-2d1834218367" />
<img width="458" height="976" alt="image" src="https://github.com/user-attachments/assets/180b2770-b824-41c1-83c3-c76eea0fb7f7" />
<img width="1919" height="973" alt="image" src="https://github.com/user-attachments/assets/e65eaee3-10a7-42dd-b5a4-dd48a4c2d214" />
<img width="1919" height="974" alt="image" src="https://github.com/user-attachments/assets/53e982a8-08f2-4f2c-b5e3-f417db64da78" />
<img width="1919" height="975" alt="image" src="https://github.com/user-attachments/assets/2484e241-9de4-4884-8c77-2d0a1d252e51" />
<img width="1919" height="978" alt="image" src="https://github.com/user-attachments/assets/89c798ed-f90e-4d19-817b-e4447e92862e" />
<img width="1919" height="975" alt="image" src="https://github.com/user-attachments/assets/64e47ba4-8c22-4bfa-8102-bd0bd9fe4efd" />
<img width="1918" height="973" alt="image" src="https://github.com/user-attachments/assets/e3cddc99-7e25-47cf-998a-b73953d7a68b" />
<img width="1919" height="967" alt="image" src="https://github.com/user-attachments/assets/36d45363-49b1-4414-ab0a-a9bdf22964f1" />
<img width="1919" height="977" alt="image" src="https://github.com/user-attachments/assets/12226c4b-4b53-4e00-a00b-6ebb1688f64f" />











