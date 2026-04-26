import { useState } from "react";
import { updateSubscriber, deleteSubscriber } from "../api/client";
import toast from "react-hot-toast";
import { Trash2, ToggleLeft, ToggleRight, Save } from "lucide-react";

export default function SubscriberCard({ sub, onRefresh }) {
  const [topics, setTopics] = useState(sub.topics);
  const [active, setActive] = useState(sub.active);

  async function handleSave() {
    await updateSubscriber(sub.id, { topics, active });
    toast.success("Subscriber updated");
    onRefresh();
  }

  async function handleDelete() {
    await deleteSubscriber(sub.id);
    toast.success("Subscriber removed");
    onRefresh();
  }

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <span style={styles.phone}>{sub.phone}</span>
        <button onClick={() => { setActive(!active); }} style={styles.toggle}>
          {active
            ? <ToggleRight size={24} color="#6366f1" />
            : <ToggleLeft  size={24} color="#555"    />}
        </button>
      </div>
      <input
        style={styles.input}
        value={topics}
        onChange={(e) => setTopics(e.target.value)}
        placeholder="Topics (e.g. AI, Science)"
      />
      <div style={styles.row}>
        <button onClick={handleSave} style={styles.saveBtn}>
          <Save size={14} /> Save
        </button>
        <button onClick={handleDelete} style={styles.deleteBtn}>
          <Trash2 size={14} /> Remove
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10,
               padding: 16, display: "flex", flexDirection: "column", gap: 12 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  phone: { color: "#fff", fontWeight: 600 },
  toggle: { background: "none", border: "none", cursor: "pointer" },
  input: { background: "#111", border: "1px solid #333", borderRadius: 6,
               color: "#fff", padding: "8px 12px", fontSize: 13 },
  saveBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 6,
               padding: "6px 14px", cursor: "pointer", display: "flex",
               alignItems: "center", gap: 6, fontSize: 13 },
  deleteBtn: { background: "#3f1515", color: "#f87171", border: "none", borderRadius: 6,
               padding: "6px 14px", cursor: "pointer", display: "flex",
               alignItems: "center", gap: 6, fontSize: 13 },
};