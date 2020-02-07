import { ApolloServer, gql, AuthenticationError, ForbiddenError } from "apollo-server-lambda";
import resolvers from "./graphql/resolvers";
import typeDefs from "./graphql/schema.graphql";
import { project_config } from "./config";
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ event }) => {
    // console.log(event);
    // if (!event.headers.authorization) throw new AuthenticationError("mssing token");
    // const token = event.headers.authorization.substr(7);
    // const user = users.find(user => user.token === token);
    // if (!user) throw new AuthenticationError("invalid token");
    // return { user };
  },
  debug: project_config.debug
});

export const graphqlHandler = server.createHandler({
  cors: {
    origin: true,
    credentials: true
  }
});
