const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLFloat,
  GraphQLList,
} = require("graphql");
const mongoose = require("mongoose");

// MongoDB 연결 설정
mongoose.connect(
  "mongodb+srv://hanjuyoung:mongodatabasepassword@cluster0.bqcoai0.mongodb.net/moneyDB"
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// MongoDB 스키마 정의
const moneySchema = new mongoose.Schema({
  src: String,
  tgt: String,
  rate: Number,
  date: String,
});

const Money = mongoose.model("Money", moneySchema);

// GraphQL 스키마 정의
const MoneyType = new GraphQLObjectType({
  name: "Money",
  fields: () => ({
    src: { type: GraphQLString },
    tgt: { type: GraphQLString },
    rate: { type: GraphQLFloat },
    date: { type: GraphQLString },
  }),
});

const RootQueryType = new GraphQLObjectType({
  name: "Query",
  fields: () => ({
    money: {
      type: new GraphQLList(MoneyType),
      args: {
        src: { type: GraphQLString },
        tgt: { type: GraphQLString },
      },
      resolve: async (_, { src, tgt }) => {
        try {
          const money = await Money.find({ src, tgt });
          return money;
        } catch (err) {
          console.error(err);
        }
      },
    },
  }),
});
const RootMutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: () => ({
    createMoney: {
      type: MoneyType,
      args: {
        src: { type: GraphQLString },
        tgt: { type: GraphQLString },
        rate: { type: GraphQLFloat },
        date: { type: GraphQLString },
      },
      resolve: async (_, args) => {
        try {
          const { src, tgt, rate, date } = args;
          const money = new Money({ src, tgt, rate, date });
          await money.save();
          return money;
        } catch (err) {
          console.error(err);
        }
      },
    },
    updateMoney: {
      type: MoneyType,
      args: {
        src: { type: GraphQLString },
        tgt: { type: GraphQLString },
        rate: { type: GraphQLFloat },
        date: { type: GraphQLString },
      },
      resolve: async (_, args) => {
        try {
          const { src, tgt, rate, date } = args;
          const existingMoney = await Money.findOne({ src, tgt });

          if (existingMoney) {
            existingMoney.rate = rate;
            existingMoney.date = date;
            await existingMoney.save();
            return existingMoney;
          }

          const money = new Money({ src, tgt, rate, date });
          await money.save();
          return money;
        } catch (err) {
          console.error(err);
        }
      },
    },
    deleteMoney: {
      type: MoneyType,
      args: {
        src: { type: GraphQLString },
        tgt: { type: GraphQLString },
      },
      resolve: async (_, args) => {
        try {
          const { src, tgt } = args;
          const existingMoney = await Money.deleteOne({ src, tgt });
        } catch (err) {
          console.error(err);
        }
      },
    },
  }),
});

const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
});

// Express 애플리케이션 설정
const app = express();
app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    graphiql: true,
  })
);

// 서버 시작
app.listen(5110, () => {
  console.log("Server started on http://localhost:5110/graphql");
});
