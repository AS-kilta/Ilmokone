import { DataTypes } from "sequelize";

import { defineMigration } from "./util";

export default defineMigration({
  name: "0007-date-include-ms",
  async up({ context: { sequelize, transaction } }) {
    const query = sequelize.getQueryInterface();
    await query.changeColumn("event", "date", {
      type: DataTypes.DATE(3),
      allowNull: true,
    }, {
                transaction,
      });

    await query.changeColumn("event", "endDate", {
      type: DataTypes.DATE(3),
      allowNull: true,
    }, {
                transaction,
      });

    await query.changeColumn("event", "registrationStartDate", {
      type: DataTypes.DATE(3),
      allowNull: true,
    }, {
                transaction,
      });

    await query.changeColumn("event", "registrationEndDate", {
      type: DataTypes.DATE(3),
      allowNull: true,
    }, {
                transaction,
      });
    },

  async down({ context: { sequelize, transaction } }) {
    const query = sequelize.getQueryInterface();
    await query.changeColumn("event", "date", {
                type: DataTypes.DATE,
                allowNull: true,
            }, {
                transaction,
            });
    await query.changeColumn("event", "endDate", {
                type: DataTypes.DATE,
                allowNull: true,
            }, {
                transaction,
            });
    await query.changeColumn("event", "registrationStartDate", {
                type: DataTypes.DATE,
                allowNull: true,
            }, {
                transaction,
            });
    await query.changeColumn("event", "registrationEndDate", {
                type: DataTypes.DATE,
                allowNull: true,
            }, {
                transaction,
            });
  }
});
