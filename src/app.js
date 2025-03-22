const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const app = express();
// test
// test2
// Middleware to parse JSON request bodies
app.use(express.json());

// Default to port 6000 if not specified
const PORT = process.env.PORT || 6000;

// The mounted persistent volume will be at this path
// Update this path later to match your Kubernetes setup
const DATA_DIR = '/huidong_PV_dir'; 

// Endpoint for storing files
app.post('/store-file', async (req, res) => {
    const {file, data} = req.body;
    
    // Validate input JSON - check if the file parameter is null
    if (!file) {
        return res.json({
            file: null,
            error: "Invalid JSON input."
        });
    }

    try {
        // Write the data to the file in the persistent volume
        await fs.writeFile(`${DATA_DIR}/${file}`, data);
        
        // Return success message
        return res.json({
            file: file,
            message: "Success."
        });
    } catch (error) {
        console.error('Error storing file:', error);
        // Return error message if there was an issue storing the file
        return res.json({
            file: file,
            error: "Error while storing the file to the storage."
        });
    }
});

// Endpoint for calculating
app.post('/calculate', async (req, res) => {
    // req.body contains the JSON that was sent in the request
    const {file, product} = req.body;

    // Step 1: Validate input JSON - check if the file parameter is null
    if (!file) {
        return res.json({
            file: file,
            error: "Invalid JSON input."
        });
    }

    // Step 2: Verify if the file exists
    try {
        // Check if file exists in the mounted volume
        await fs.access(`${DATA_DIR}/${file}`);

        // File exists: send the request to the processor service in container 2
        // Updated URL to use Kubernetes service name (will define this in K8s YAML later)
        const processorServiceUrl = process.env.PROCESSOR_SERVICE_URL;
        const response = await fetch(`${processorServiceUrl}/process`, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file, product })
        });

        // Get the reponse from container 2
        const result = await response.json();
        return res.json(result);

    } catch (error) {
        console.error('Error in calculate endpoint:', error);
        // File doesn't exist: return the file not found error message.
        return res.json({
            file: file,
            error: "File not found."
        });
    }
});

// Health check endpoint for Kubernetes
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`API Gateway service listening on port ${PORT}`);
    console.log(`Using data directory: ${DATA_DIR}`);
});
