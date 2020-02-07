import { UserInputError } from "apollo-server-lambda";
import { getMovie, createMovie } from "./db";

const resolvers = {
  Query: {
    movie: async (_, { year, title }) => await getMovie(year, title)
  },
  Mutation: {
    createMovie: async (_, { year, title, info }) => await createMovie(year, title, info)
  }
};

export default resolvers;
