# AS Ilmokone Setup

## Web App Configuration
Ilmokone's web app Docker image is hosted in Github Container
Registery. The image is automatically build on every
push to `main` branch. Image is pulled to VM in Azure and started
alongside database using `docker compose`.

## Database Setup
AS Ilmokone uses MariaDB Docker image.![as-ilmokone-setup-diagram](https://github.com/AS-kilta/Ilmokone/assets/49514529/e93e55a9-f6ac-4360-982b-46d089b97b02)


## Email Setup
Email sending is done via Gmail API. There's a Google Workspace
Account set for this purpose. Gmail API is activated from
Google Cloud services. Nodemailer handles OAuth login to
this account, but the refresh token must be collected from
https://developers.google.com/oauthplayground/ with a grant
to mail.google.com scope.

## Setup Diagram
![as-ilmokone-setup-diagram](https://github.com/AS-kilta/Ilmokone/assets/49514529/df71afab-dd25-44f0-9ac0-01c889419afb)
