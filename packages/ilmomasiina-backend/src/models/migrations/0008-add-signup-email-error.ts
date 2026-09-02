import { DataTypes } from "sequelize";

import { defineMigration } from "./util";

export default defineMigration({
  name: "0008-add-signup-email-error",
  async up({ context: { sequelize, transaction } }) {
    const query = sequelize.getQueryInterface();
    await query.addColumn(
      "signup",
      "emailError",
      {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      { transaction },
    );
  },
});
