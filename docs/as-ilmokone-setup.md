# AS Ilmokone Setup

## Web App Configuration

Ilmokone's web app Docker image is hosted in Github Container
Registery. The image is automatically build on every
push to `main` branch. Image is pulled to VM in Azure and started
alongside database using `docker compose`.

## Database Setup

AS Ilmokone uses MariaDB Docker image.

## Email Setup

Email sending is done via Gmail API. There's a Google Workspace
Account set for this purpose. Gmail API is activated from
Google Cloud services. Nodemailer handles OAuth login to
this account, but the refresh token must be collected from
https://developers.google.com/oauthplayground/ with a grant
to mail.google.com scope.

## Setup Diagram

![as-ilmokone-setup-diagram](https://github.com/AS-kilta/Ilmokone/assets/49514529/524c2bdf-fe0b-4e1e-81a0-c0f38843df5b)
