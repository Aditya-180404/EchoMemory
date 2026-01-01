<?php
/**
 * EchoMemory Chatbot API
 * Endpoint: POST /api/chat.php
 */

require_once __DIR__ . '/ApiController.php';

class ChatController extends ApiController {

    public function __construct() {
        parent::__construct(true); // Auth required
    }

    public function handle() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->errorResponse("Method not allowed.", 405);
        }

        $input = $this->getJsonInput();
        $message = $input['message'] ?? '';
        $userId = $GLOBALS['user_id'];

        if (empty($message)) {
            $this->errorResponse("Message is required.");
        }

        // 1. Fetch relevant user context (Recent memories)
        $pdo = getDBConnection();
        $stmt = $pdo->prepare("SELECT narrative_text FROM memories WHERE user_id = ? AND narrative_text IS NOT NULL ORDER BY created_at DESC LIMIT 5");
        $stmt->execute([$userId]);
        $memories = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $context = implode("\n", $memories);

        // 2. Call Azure OpenAI (Simulation for now or direct if using PHP OpenAI client)
        // In production, you would use a cURL request to your Azure OpenAI endpoint
        $reply = $this->getAzureOpenAIResponse($message, $context);

        $this->successResponse("Success", ['reply' => $reply]);
    }

    private function getAzureOpenAIResponse($message, $context) {
        $endpoint = AZURE_OPENAI_ENDPOINT . "openai/deployments/" . AZURE_OPENAI_DEPLOYMENT . "/chat/completions?api-version=2023-05-15";
        
        $data = [
            'messages' => [
                ['role' => 'system', 'content' => "You are EchoMemory Assistant. Help the user remember things based on their context: \n" . $context],
                ['role' => 'user', 'content' => $message]
            ],
            'temperature' => 0.7
        ];

        $ch = curl_init($endpoint);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'api-key: ' . AZURE_OPENAI_KEY
        ]);

        $response = curl_exec($ch);
        $result = json_decode($response, true);
        curl_close($ch);

        return $result['choices'][0]['message']['content'] ?? "I'm sorry, I'm having trouble connecting to my memory banks right now.";
    }
}

$controller = new ChatController();
$controller->handle();
