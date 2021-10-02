module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      address: String,
      amount: Number,
      date: Date
    },
    { timestamps: true }
  );

  schema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  return mongoose.model("payments", schema);
};
