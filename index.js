import { ApolloServer, gql } from "apollo-server-lambda";
import resolvers from "./graphql/resolvers";
import typeDefs from "./graphql/schema.graphql";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ event, context }) => ({
    headers: event.headers,
    functionName: context.functionName,
    event,
    context
  })
});

export const graphqlHandler = server.createHandler({
  cors: {
    origin: true,
    credentials: true
  }
});
