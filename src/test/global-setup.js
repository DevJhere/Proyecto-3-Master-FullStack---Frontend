// Zona horaria fija para que los tests de fechas den el mismo resultado en cualquier máquina
export default function setup() {
  process.env.TZ = "Europe/Madrid";
}
