const {User} = require('../models');
const {signToken} = require('../utils/auth');
const {AuthenticationError} = require('apollo-server-express');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({})
          .select('-__v -password')
          .populate('books');

        return userData;
      }

      throw new AuthenticationError('Not logged in');
    },
  },
  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return {user, token};
    },
    login: async (parent, {email, password}) => {
      const user = await User.findOne({email});

      if (!user) {
        throw new AuthenticationError('No user found with this email address');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);

      return {token, user};
    },
    saveBook: async (parent, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          {_id: context.user._id},
          {
            $addToSet: {savedBooks: args.bookToSave},
          },
          {new: true, runValidators: true}
        );
        return updatedUser;
      }
      throw new AuthenticationError('You need to be logged in!');
    },
    removeBook: async (parent, {bookId}, context) => {
      if (context.user) {
        return User.findByIdAndUpdate(
          {_id: context.user._id},
          {
            $pull: {
              savedBooks: {bookId},
            },
          },
          {new: true}
        );
      }
      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

module.exports = resolvers;
