const { ApolloServer, gql } = require("apollo-server");
const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");
const conectarDB = require("./config/db");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });
conectarDB();
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Va estar disponible en todos los resolvers

    const token = req.headers["authorization"] || "";

    if (token) {
      try {
        const usuario = jwt.verify(token.replace("Bearer ", ""), process.env.SECRETA);
        return {
          usuario,
        };
      } catch (error) {
        console.log("ERROR - VERIFICATION TOKEN", error);
      }
    }
  },
});
server.listen().then(({ url }) => {
  console.log("Server running on " + url);
});
