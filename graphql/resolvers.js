const people = [
  {
    id: 1,
    name: "a",
    age: 19,
    gender: "male"
  },
  {
    id: 2,
    name: "b",
    age: -10,
    gender: "female"
  },
  {
    id: 3,
    name: "c",
    age: 30,
    gender: "male"
  },
  {
    id: 4,
    name: "d",
    age: 4000,
    gender: "female"
  }
];

function getById(id) {
  const filteredPeople = people.filter(person => person.id === id);
  return filteredPeople[0];
}

const resolvers = {
  Query: {
    people: () => people,
    person: (_, { id }) => getById(id)
  }
};

export default resolvers;
