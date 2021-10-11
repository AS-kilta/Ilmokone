import {
  DataTypes, HasOneCreateAssociationMixin, HasOneGetAssociationMixin, HasOneSetAssociationMixin, Model, Optional,
} from 'sequelize';

import { IlmoApplication } from '../defs';
import { Question } from './question';
import { RANDOM_ID_LENGTH } from './randomId';
import { Signup } from './signup';

export interface AnswerAttributes {
  id: string;
  answer: string;
  questionId: Question['id'];
  signupId: Signup['id'];
}

export interface AnswerCreationAttributes extends Optional<AnswerAttributes, 'id'> {}

export class Answer extends Model<AnswerAttributes, AnswerCreationAttributes> implements AnswerAttributes {
  public id!: string;
  public answer!: string;

  public questionId!: Question['id'];
  public question?: Question;
  public getQuestion!: HasOneGetAssociationMixin<Question>;
  public setQuestion!: HasOneSetAssociationMixin<Question, Question['id']>;
  public createQuestion!: HasOneCreateAssociationMixin<Question>;

  public signupId!: Signup['id'];
  public signup?: Signup;
  public getSignup!: HasOneGetAssociationMixin<Signup>;
  public setSignup!: HasOneSetAssociationMixin<Signup, Signup['id']>;
  public createSignup!: HasOneCreateAssociationMixin<Signup>;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function setupAnswerModel(this: IlmoApplication) {
  const sequelize = this.get('sequelize');

  Answer.init({
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    questionId: {
      type: DataTypes.CHAR(RANDOM_ID_LENGTH),
      allowNull: false,
    },
    signupId: {
      type: DataTypes.CHAR(RANDOM_ID_LENGTH),
      allowNull: false,
    },
    answer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'answer',
    freezeTableName: true,
    paranoid: true,
  });

  return Answer;
}