# Token

Only the owner of a container can PUT and DELETE files. Make sure to always define the token as follows:

  1. Register a container by calling the API `POST /node/register` **or** put the public key of the container in the keys directory as `container.pub` where `container` is the name of the container to create and set an access key for the container in a file as `container.access_key`.
  1. Create a JsonWebToken token with the field `aud` equals to the registered `container`.
  1. Add the token in the header `authorization` as `Authorization: Bearer <token>`.

To disable container registration, set `IS_REGISTRATION_ENABLED` to `false` in the configuration.
