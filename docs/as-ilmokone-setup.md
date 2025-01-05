# AS Ilmokone

### Web App Configuration

Ilmokone's web app Docker image is hosted in Github Container
Registery. The image is automatically build on every
push to `main` branch. Image is pulled to VM in Azure and started
alongside database using `docker compose`.

### Database Setup

AS Ilmokone uses MariaDB Docker image.

### Automatic Deployment & Backups

On Azure VM there is a cron job running nightly. It creates MariaDB sqldump, compresses it and places it with the rest of the backup dumps. It also automatically deletes over 30 day old backup dumps, usually just one (as this runs nightly). After that it runs `docker compose up -d` which pulls the latest Ilmokone image (if any) and only stops and re-runs Ilmokone if a new one is found. This allows minimal interaction in the vm.

### Email Setup

Email sending is done via Gmail API. There's a Google Workspace
Account set for this purpose. Gmail API is activated from
Google Cloud services. Nodemailer handles OAuth login to
this account, but the refresh token must be collected from
https://developers.google.com/oauthplayground/ with a grant
to `mail.google.com` scope.

### Setup Diagram

![as-ilmokone-setup-diagram](https://github.com/AS-kilta/Ilmokone/assets/49514529/524c2bdf-fe0b-4e1e-81a0-c0f38843df5b)

## Development

The `main` branch is protected and can only be pushed to via a pull request. The tests and building are done with Github actions and doesn't require human input. As the `main` is protected it requires all the tests to pass and someone other than the PR creator to review the changes made. If the lint/format test fails try running `pnpm run lint:fix` or `pnpm run format` in your working directory.

### Upgrades from Upstream

It's wise to periodically fetch and merge updates from Tietokilta's Ilmomasiina repository. This is done merging `tietokilta/ilmomasiina/dev` into `as-kilta/ilmokone/tietokilta-dev` *organization/repository/branch* and resolving all merge conflicts manually. In practise this branch runs parallel with the `main` and serves as a staging branch for changes coming from upstream branch `tietokilta/dev`. Remember to merge `main` to `tietokilta-dev` before submitting a pull request. The `tietokilta-dev` branch is also protected and can't be deleted.

Remember to also check the CHANGELOG.md for breaking changes.

### Docker compose

- `docker-compose.yml` is used for developing. Should produce a similar end product to the production compose.
- `docker-compose.prod.yml` is Tietokilta's original production compose.
- `docker-compose.as.yml` is the production compose AS-guild uses. Any changes here must be transferred manually to the vm.
