/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_123612952")

  // add field
  collection.fields.addAt(5, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "email3230430301",
    "name": "email_to",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "email"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_123612952")

  // remove field
  collection.fields.removeById("email3230430301")

  return app.save(collection)
})
