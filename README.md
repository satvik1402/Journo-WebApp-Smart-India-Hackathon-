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

## Database Schema

The database consists of the following tables:

-   **users**: Stores user information, including authentication details and profile data.
-   **trips**: Contains records of all automatically detected trips, including origin, destination, mode, and calculated metrics like CO₂ emissions.
-   **manual_trip**: Stores trips that have been manually entered by users.
-   **trip_points**: Contains the raw GPS data points for each trip, used for detailed route visualization and analysis.
-   **ml_predictions**: Stores the output of the machine learning models, such as predicted travel times and mode suggestions.

## API Documentation

A summary of the available API endpoints can be found below. For a detailed description of each endpoint, please refer to the API documentation.

-   `/api/users`: User registration and management.
-   `/api/trips`: Trip creation, retrieval, and management.
-   `/api/analytics`: Endpoints for data insights, heatmaps, and reports.
-   `/api/ml`: Machine learning predictions and analysis.

## Contributors

This project was developed as part of the Smart India Hackathon. We welcome contributions from the community. Please refer to the contributing guidelines for more information.
