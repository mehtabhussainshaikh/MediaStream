import { User } from './user.model.js';

function publicUser(document) {
  if (!document) return null;
  const value = document.toObject ? document.toObject() : { ...document };
  delete value.passwordHash;
  return value;
}

export function createUserRepository(model = User) {
  return Object.freeze({
    async create(input) {
      return publicUser(await model.create(input));
    },
    async findCredentialsByEmail(email) {
      return model.findOne({ email }).select('+passwordHash').lean();
    },
    async findPublicById(id) {
      return publicUser(await model.findById(id).lean());
    },
  });
}

