// Komponen untuk menampilkan nama "Travia" dengan "avi" berwarna orange.
// Gunakan ini di mana saja nama brand ditulis sebagai teks (footer, heading, dll).
const TraviaName = ({ className = '' }) => (
  <span className={className}>
    Tr<span className="text-travia-orange">avi</span>a
  </span>
);

export default TraviaName;
