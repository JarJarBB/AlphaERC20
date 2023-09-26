"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useState, useEffect } from "react";
import { getContributions, getZBalances } from "../evm-utils";
import styles from "./page.module.css";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Home() {
  const [contributions, setContributions] = useState<number[]>([-1, 0, 0]);
  const [zBalances, setZBalances] = useState<number[]>([0, 0, 0]);
  const data = {
    labels: ["Owner", "Alice", "Bob"],
    datasets: [
      {
        label: " amount",
        data: contributions,
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
        ],
      },
    ],
  };

  useEffect(() => {
    const storeContributions = async () => {
      const data = await getContributions();
      if (data.every((c) => !c)) {
        data[0] = -1; // keep doughnut chart visible
      }
      setContributions(data);
    };
    const storeZBalances = async () => {
      const data = await getZBalances();
      setZBalances(data);
    };
    storeContributions();
    storeZBalances();
  }, []);

  return (
    <main className={styles.main}>
      <h2 className={styles.roundbox}>Y Contributions</h2>
      <Doughnut data={data} className={styles.doughnut} />
      <br />
      <br />
      <br />
      <h2 className={styles.roundbox}>Z Balances</h2>
      <br />
      <div className={styles.roundbox}>
        <p>
          Owner: {zBalances[0]} | Alice: {zBalances[1]} | Bob: {zBalances[2]}
        </p>
      </div>
    </main>
  );
}
