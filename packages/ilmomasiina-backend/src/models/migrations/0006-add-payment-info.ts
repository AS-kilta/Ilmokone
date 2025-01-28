import { DataTypes } from "sequelize";

import { defineMigration } from "./util";

export default defineMigration({
  name: "0006-add-payment-info",
  async up({ context: { sequelize, transaction } }) {
    const query = sequelize.getQueryInterface();
    await query.addColumn(
      "event",
      "message",
      {
        type: DataTypes.STRING,
      },
      { transaction },
    );
    await query.addColumn(
      "event",
      "bankId",
      {
        type: DataTypes.STRING,
      },
      { transaction },
    );
    await query.addColumn(
      "event",
      "receiver",
      {
        type: DataTypes.STRING,
      },
      { transaction },
    );
    await query.addColumn(
      "event",
      "dueDate",
      {
        type: DataTypes.DATE,
      },
      { transaction },
    );
    await query.addColumn(
      "event",
      "showBarcode",
      {
        type: DataTypes.BOOLEAN,
      },
      { transaction },
    );
    await query.addColumn(
      "event",
      "paymentBarcode",
      {
        type: DataTypes.STRING,
      },
      { transaction },
    );
  },
});
