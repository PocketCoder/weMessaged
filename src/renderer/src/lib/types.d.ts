export interface Message {
	message_id: string; // ROWID of the message
	other_party: string; // Contact identifier (number or contact identifier)
	from_me_flag: number; // 1 if sent by you, 0 if received
	message_text: string; // Text of the message
	apple_date_int: number; // macOS timestamp (seconds since 2001-01-01)
	date_read_int: number | null; // Timestamp when the message was read (nullable)
	date_delivered_int: number | null; // Timestamp when the message was delivered (nullable)
	converted_date?: string;
}
