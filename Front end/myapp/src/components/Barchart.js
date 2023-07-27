import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import socketIOClient from 'socket.io-client';

const Barchart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Data Values',
        data: [],
        backgroundColor: 'rgba(75,192,192,0.6)',
        borderWidth: 1,
      },
    ],
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('/data');
      const data = response.data;
      const labels = data.map((item) => item.title);
      const chartDataValues = data.map((item) => item.data);

      setChartData({
        labels,
        datasets: [
          {
            ...chartData.datasets[0],
            data: chartDataValues,
          },
        ],
      });
    } catch (error) {
      console.log('Error fetching data:', error);
    }
  }, [chartData.datasets]);

  useEffect(() => {
    fetchData(); // Call the function directly inside useEffect

    const socket = socketIOClient('http://localhost:4000'); // Replace with your backend server URL
    socket.on('dataCreated', handleDataCreated);
    socket.on('dataDeleted', handleDataDeleted);
    return () => socket.disconnect();
  }, [fetchData]);

  const handleDataCreated = (newData) => {
    // Handle data created event from the server
    // For real-time updates, you can add the new data to the chart
    // For example, you can update the state with the new data
    setChartData((prevChartData) => ({
      ...prevChartData,
      labels: [...prevChartData.labels, newData.title],
      datasets: [
        {
          ...prevChartData.datasets[0],
          data: [...prevChartData.datasets[0].data, newData.data],
        },
      ],
    }));
  };

  const handleDataDeleted = (deletedData) => {
    // Handle data deleted event from the server
    // For real-time updates, you can remove the deleted data from the chart
    // For example, you can update the state by filtering out the deleted data
    setChartData((prevChartData) => ({
      ...prevChartData,
      labels: prevChartData.labels.filter((label) => label !== deletedData.title),
      datasets: [
        {
          ...prevChartData.datasets[0],
          data: prevChartData.datasets[0].data.filter((data) => data !== deletedData.data),
        },
      ],
    }));
  };

  return (
    <div>
      <h2>Bar Chart</h2>
      <Bar data={chartData} />
    </div>
  );
};

export default Barchart;
