# Software Requirements Specification (SRS) for Futsal Web App

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to outline the requirements for the development of a web application named "Futsal". This application will allow users to browse and view details of futsal venues, check availability of booking times, and book futsal slots through a payment process involving QR codes and manual verification by venue managers.

### 1.2 Scope
The Futsal web app will provide the following functionalities:
- Display a list of all available futsal places.
- Show detailed information about each futsal place.
- Display booked and free time slots for each futsal place.
- Allow users to book time slots by initiating a payment process.
- Integrate a payment system where users scan a QR code provided by the futsal manager, make the payment, upload a screenshot as proof, and await manual verification by the manager.
- Provide an admin panel for managers to verify payments and update booking statuses.

The app will be a web-based platform accessible via standard web browsers. It will not include mobile app development unless specified otherwise.

### 1.3 Definitions, Acronyms, and Abbreviations
- **Futsal**: A type of indoor soccer played in a smaller court.
- **QR Code**: Quick Response Code, a two-dimensional barcode used for payment initiation.
- **Admin Panel**: A restricted interface for futsal managers to manage bookings and verifications.
- **User**: An individual accessing the app to view or book futsal slots.
- **Manager**: The administrator of a futsal venue responsible for verifying payments.

### 1.4 References
- None at this time.

## 2. Overall Description

### 2.1 Product Perspective
The Futsal web app is a standalone web application designed to facilitate the discovery and booking of futsal venues. It interfaces with payment systems via QR codes and relies on manual verification by venue managers. The app will use a database to store information about venues, bookings, and user interactions.

### 2.2 Product Functions
- **Venue Listing**: Retrieve and display a list of futsal places.
- **Venue Details**: Show detailed information about a selected futsal place (e.g., location, facilities, contact info).
- **Availability Check**: Display booked and free time slots for each venue.
- **Booking Process**: Allow users to select a time slot, view the manager's QR code, make payment, upload screenshot, and submit for verification.
- **Payment Verification**: Enable managers to review uploaded screenshots and confirm or reject bookings via an admin panel.
- **Status Updates**: Automatically update booking statuses upon manager approval.

### 2.3 User Characteristics
- **General Users**: Individuals interested in playing futsal. They are expected to have basic computer literacy and access to a web browser and a device capable of scanning QR codes and uploading images.
- **Venue Managers**: Staff or owners of futsal venues. They need access to an admin panel and should be familiar with basic administrative tasks.

### 2.4 Constraints
- The application must be responsive and compatible with modern web browsers (e.g., Chrome, Firefox, Safari).
- Payment verification is manual and relies on manager intervention; no automated payment gateway integration is required.
- The app must comply with data privacy regulations (e.g., GDPR if applicable).
- Development should use standard web technologies (e.g., HTML, CSS, JavaScript, backend framework like Node.js or Python/Django).

## 3. Specific Requirements

### 3.1 External Interface Requirements

#### 3.1.1 User Interfaces
- **Home Page**: List of futsal places with search/filter options.
- **Venue Detail Page**: Display venue information, map, and time slot availability.
- **Booking Page**: Form for selecting time slot, displaying QR code, uploading screenshot.
- **Admin Panel**: Dashboard for managers to view pending verifications and update statuses.

#### 3.1.2 Hardware Interfaces
- Standard web server hosting the application.
- Database server for storing data.

#### 3.1.3 Software Interfaces
- Web browser for user access.
- Firebase for authentication and data storage.
- UploadThing for file storage (e.g., screenshots).

### 3.2 Functional Requirements

#### 3.2.1 Venue Management
- **FR1**: The system shall display a list of all futsal places.
- **FR2**: The system shall allow users to view detailed information about each futsal place, including name, address, facilities, and contact details.

#### 3.2.2 Availability and Booking
- **FR3**: The system shall display booked and free time slots for each futsal place.
- **FR4**: The system shall allow users to select a free time slot for booking.

#### 3.2.3 Payment and Verification
- **FR5**: Upon booking selection, the system shall display the QR code associated with the futsal manager.
- **FR6**: The system shall allow users to upload a screenshot of the payment confirmation.
- **FR7**: The system shall submit the booking request for manual verification by the manager.
- **FR8**: The system shall provide an admin panel for managers to review uploaded screenshots and approve or reject bookings.
- **FR9**: Upon approval, the system shall update the booking status to "booked" and mark the time slot as unavailable.

### 3.3 Non-Functional Requirements

#### 3.3.1 Performance
- The application shall load venue lists and details within 2 seconds under normal network conditions.
- Booking submissions shall be processed within 5 seconds.

#### 3.3.2 Security
- User data (e.g., uploaded screenshots) shall be stored securely and only accessible to authorized managers.
- The admin panel shall require authentication (e.g., username/password).

#### 3.3.3 Usability
- The interface shall be intuitive, with clear navigation and instructions for the booking process.

#### 3.3.4 Reliability
- The system shall have 99% uptime, excluding scheduled maintenance.

#### 3.3.5 Maintainability
- Code shall be modular and well-documented for future updates.

## 4. Appendices

### 4.1 Assumptions and Dependencies
- QR codes will be provided by futsal managers and stored in the system.
- Managers will have access to devices for verifying payments.
- The application will use Firebase for user authentication and data storage.
- The application will use UploadThing for storing uploaded files such as payment screenshots.

### 4.2 Future Enhancements
- Integration with automated payment gateways.
- Mobile app version.
- User accounts for booking history.
