// PostgreSQL stores vitals in flat columns; the public API retains nested vitals.
const formatConsultation = (value) => {
  if (!value) return value;

  const plain = typeof value.toJSON === 'function' ? value.toJSON() : { ...value };
  const { temperature, pulse, ...rest } = plain;

  return {
    ...rest,
    vitals: { temperature, pulse }
  };
};

module.exports = { formatConsultation };
