FROM node:alpine

COPY . .

RUN yarn
RUN yarn test:clean && yarn build && yarn test

# RUN yarn add -D typescript@3.0.1
# RUN yarn test:clean && yarn build && yarn test

# RUN yarn add -D typescript@3.1.1
# RUN yarn test:clean && yarn build && yarn test