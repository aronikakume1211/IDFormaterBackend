// adminbro.js
const bcrypt = require("bcryptjs");
const Users = require("../models/user.schema.js");
const Admin = require('../models/admin.shcema.js');
const Payment = require("../models/payment.schema.js");
const People = require("../models/person.schema.js");
// const Admin = require("../mo?dels/admin.shcema.js");

const setupAdmin = async () => {
  const AdminJS = (await import("adminjs")).default;
  const AdminJSExpress = (await import("@adminjs/express")).default;
  const { Database, Resource } = await import("@adminjs/mongoose");

AdminJS.registerAdapter({ Database, Resource });

  const adminJs = new AdminJS({
    resources: [
      {
        resource: Users,
        options: {
          properties: {
            encryptedPassword: { isVisible: false },
            _id: {isVisible: false},
            passwordHash: {isVisible: false},
            profilePicture: {isVisible: false},
            password: {
              type: "string",
              isVisible: {
                list: false,
                filter: false,
                show: false,
                edit: true,
              },
            },
          },
          actions: {
            new: {
              before: async (request) => {
                if (request.payload.password) {
                  request.payload = {
                    ...request.payload,
                    encryptedPassword: await bcrypt.hash(
                      request.payload.password,
                      10
                    ),
                    password: undefined,
                  };
                }
                return request;
              },
            },
          },
        },
      },
      { resource: Payment  },
      // { resource: People},
      { resource: Admin}
    ],
    rootPath: "/admin",
  });

  const router = AdminJSExpress.buildAuthenticatedRouter(adminJs, {
    cookieName: "adminjs",
    cookiePassword: process.env.COOKIES_PASS,
    authenticate: async (email, password) => {
      const user = await Admin.findOne({ email });
      if (user) {
        const matched = await bcrypt.compare(password, user.passwordHash);
        if (matched) return user;
      }
      return false;
    },
  });

  return { adminJs, router };
};

module.exports = setupAdmin;
