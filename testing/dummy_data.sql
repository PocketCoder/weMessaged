-- DUMMY DATA FOR IMESSAGE DATABASE SCHEMA

-- =================================================================
-- Step 1: Populate `handle` table with participants
-- A 'handle' represents a contact identity (phone number or email).
-- ROWID=1: Me (the user of this database)
-- ROWID=2: Jane Doe (a contact)
-- ROWID=3: John Smith (another contact)
-- ROWID=4: Alex Ray (a contact)
-- ROWID=5: Sarah Lee (a contact)
-- =================================================================

INSERT INTO "handle" (ROWID, id, country, service, uncanonicalized_id, person_centric_id) VALUES
(1, 'me@icloud.com', 'gb', 'iMessage', 'me@icloud.com', 'person-centric-id-me'),
(2, '+15551234567', 'gb', 'iMessage', '555-123-4567', 'person-centric-id-jane'),
(3, '+15559876543', 'gb', 'iMessage', '555-987-6543', 'person-centric-id-john'),
(4, 'alex.ray@work.com', 'us', 'iMessage', 'alex.ray@work.com', 'person-centric-id-alex'),
(5, '+15558889999', 'us', 'iMessage', '555-888-9999', 'person-centric-id-sarah');


-- =================================================================
-- Step 2: Create the chats (conversations)
-- =================================================================

-- Chat 1: 1-on-1 with Jane Doe
INSERT INTO "chat" (ROWID, guid, style, state, account_id, chat_identifier, service_name, display_name, group_id, last_read_message_timestamp) VALUES
(1, 'iMessage;+;chat-guid-jane-doe', 45, 3, 'me@icloud.com', '+15551234567', 'iMessage', 'Jane Doe', NULL, 1672531360000000000);

-- Chat 2: 1-on-1 with John Smith
INSERT INTO "chat" (ROWID, guid, style, state, account_id, chat_identifier, service_name, display_name, group_id, last_read_message_timestamp) VALUES
(2, 'iMessage;+;chat-guid-john-smith', 45, 3, 'me@icloud.com', '+15559876543', 'iMessage', 'John Smith', NULL, 1672963200000000000);

-- Chat 3: 1-on-1 with Alex Ray
INSERT INTO "chat" (ROWID, guid, style, state, account_id, chat_identifier, service_name, display_name, group_id, last_read_message_timestamp) VALUES
(3, 'iMessage;+;chat-guid-alex-ray', 45, 3, 'me@icloud.com', 'alex.ray@work.com', 'iMessage', 'Alex Ray', NULL, 1672617220000000000);

-- Chat 4: 1-on-1 with Sarah Lee
INSERT INTO "chat" (ROWID, guid, style, state, account_id, chat_identifier, service_name, display_name, group_id, last_read_message_timestamp) VALUES
(4, 'iMessage;+;chat-guid-sarah-lee', 45, 3, 'me@icloud.com', '+15558889999', 'iMessage', 'Sarah Lee', NULL, 1672882100000000000);


-- =================================================================
-- Step 3: Link chats to their participants in `chat_handle_join`
-- =================================================================

-- Link Chat 1 (Jane)
INSERT INTO "chat_handle_join" (chat_id, handle_id) VALUES (1, 1);
INSERT INTO "chat_handle_join" (chat_id, handle_id) VALUES (1, 2);

-- Link Chat 2 (John)
INSERT INTO "chat_handle_join" (chat_id, handle_id) VALUES (2, 1);
INSERT INTO "chat_handle_join" (chat_id, handle_id) VALUES (2, 3);

-- Link Chat 3 (Alex)
INSERT INTO "chat_handle_join" (chat_id, handle_id) VALUES (3, 1);
INSERT INTO "chat_handle_join" (chat_id, handle_id) VALUES (3, 4);

-- Link Chat 4 (Sarah)
INSERT INTO "chat_handle_join" (chat_id, handle_id) VALUES (4, 1);
INSERT INTO "chat_handle_join" (chat_id, handle_id) VALUES (4, 5);


-- =================================================================
-- Step 4: Create messages for the chats
-- =================================================================

-- Conversation with Jane (Chat ID 1)
INSERT INTO "message" (ROWID, guid, text, handle_id, service, date, date_read, date_delivered, is_from_me, is_sent, is_read) VALUES
(101, 'message-guid-01', 'Hey!', 2, 'iMessage', 1672531200, 1672531210, 1672531205, 0, 1, 1),
(102, 'message-guid-02', 'Hi Jane! How are you?', 1, 'iMessage', 1672531230, 1672531240, 1672531235, 1, 1, 1),
(103, 'message-guid-03', 'Doing well, thanks for asking.', 2, 'iMessage', 1672531260, 0, 1672531265, 0, 1, 0),
(104, 'message-guid-10', 'Did you see the game last night?', 1, 'iMessage', 1672531300, 1672531310, 1672531305, 1, 1, 1),
(105, 'message-guid-11', 'No, I missed it! Who won?', 2, 'iMessage', 1672531320, 1672531330, 1672531325, 0, 1, 1),
(106, 'message-guid-12', 'The home team, it was a great game.', 1, 'iMessage', 1672531340, 1672531350, 1672531345, 1, 1, 1),
(107, 'message-guid-13', 'Awesome! I''ll have to watch the highlights.', 2, 'iMessage', 1672531360, 0, 1672531365, 0, 1, 0);

-- Conversation with John (Chat ID 2)
INSERT INTO "message" (ROWID, guid, text, handle_id, service, date, is_from_me, is_sent, is_read) VALUES
(201, 'message-guid-j1', 'Hi John, are you free for a call this afternoon?', 1, 'iMessage', 1672962000, 1, 1, 1),
(202, 'message-guid-j2', 'Hey! Yes, I should be. Around 3pm?', 3, 'iMessage', 1672962100, 1, 1, 1),
(203, 'message-guid-j3', '3pm works for me. I''ll send a calendar invite.', 1, 'iMessage', 1672962200, 1, 1, 1),
(204, 'message-guid-j4', 'Perfect, talk to you then.', 3, 'iMessage', 1672962300, 0, 1, 0);

-- Conversation with Alex (Chat ID 3)
INSERT INTO "message" (ROWID, guid, text, handle_id, service, date, date_read, date_delivered, is_from_me, is_sent, is_read) VALUES
(301, 'message-guid-08', 'Hey, do you have the latest report?', 4, 'iMessage', 1672617000, 1672617010, 1672617005, 0, 1, 1),
(302, 'message-guid-09', 'Yes, sending it over now.', 1, 'iMessage', 1672617120, 0, 1672617125, 1, 1, 0),
(303, 'message-guid-14', 'Thanks! Got the report.', 4, 'iMessage', 1672617200, 1672617210, 1672617205, 0, 1, 1),
(304, 'message-guid-15', 'No problem. Let me know if you have any questions.', 1, 'iMessage', 1672617220, 0, 1672617225, 1, 1, 0);

-- Conversation with Sarah (Chat ID 4)
INSERT INTO "message" (ROWID, guid, text, handle_id, service, date, is_from_me, is_sent, is_read) VALUES
(401, 'message-guid-16', 'Hi! Are we still on for lunch tomorrow?', 5, 'iMessage', 1672700000, 0, 1, 1),
(402, 'message-guid-17', 'Yes, absolutely! 12:30 at the usual spot?', 1, 'iMessage', 1672700100, 1, 1, 1),
(403, 'message-guid-18', 'Sounds perfect. See you then!', 5, 'iMessage', 1672700200, 0, 1, 1),
(404, 'message-guid-19', 'Hey, I might be running 10 minutes late.', 1, 'iMessage', 1672786400, 1, 1, 1),
(405, 'message-guid-20', 'No worries, I just got here myself. Take your time.', 5, 'iMessage', 1672786500, 0, 1, 1),
(406, 'message-guid-21', 'Okay, just parked. Walking over now.', 1, 'iMessage', 1672787000, 1, 1, 1),
(407, 'message-guid-22', 'Great lunch! We should do that more often.', 5, 'iMessage', 1672795000, 0, 1, 1),
(408, 'message-guid-23', 'Totally agree. How about next week?', 1, 'iMessage', 1672795100, 1, 1, 1),
(409, 'message-guid-24', 'Works for me! I''ll check my calendar.', 5, 'iMessage', 1672795200, 0, 1, 1),
(410, 'message-guid-25', 'What a day! That meeting was something else.', 1, 'iMessage', 1672881600, 1, 1, 1),
(411, 'message-guid-26', 'You can say that again. I need a coffee.', 5, 'iMessage', 1672881700, 0, 1, 1),
(412, 'message-guid-27', 'I''m already on my second cup. Want to grab one later?', 1, 'iMessage', 1672881800, 1, 1, 1),
(413, 'message-guid-28', 'Can''t, I have that deadline. Raincheck?', 5, 'iMessage', 1672881900, 0, 1, 1),
(414, 'message-guid-29', 'Of course. Good luck with the deadline!', 1, 'iMessage', 1672882000, 1, 1, 1),
(415, 'message-guid-30', 'Thanks! I''ll need it.', 5, 'iMessage', 1672882100, 0, 1, 1);


-- =================================================================
-- Step 5: Link messages to their respective chats in `chat_message_join`
-- =================================================================

-- Link messages for Chat 1 (Jane)
INSERT INTO "chat_message_join" (chat_id, message_id, message_date) VALUES
(1, 101, 1672531200),
(1, 102, 1672531230),
(1, 103, 1672531260),
(1, 104, 1672531300),
(1, 105, 1672531320),
(1, 106, 1672531340),
(1, 107, 1672531360);

-- Link messages for Chat 2 (John)
INSERT INTO "chat_message_join" (chat_id, message_id, message_date) VALUES
(2, 201, 1672962000),
(2, 202, 1672962100),
(2, 203, 1672962200),
(2, 204, 1672962300);

-- Link messages for Chat 3 (Alex)
INSERT INTO "chat_message_join" (chat_id, message_id, message_date) VALUES
(3, 301, 1672617000),
(3, 302, 1672617120),
(3, 303, 1672617200),
(3, 304, 1672617220);

-- Link messages for Chat 4 (Sarah)
INSERT INTO "chat_message_join" (chat_id, message_id, message_date) VALUES
(4, 401, 1672700000),
(4, 402, 1672700100),
(4, 403, 1672700200),
(4, 404, 1672786400),
(4, 405, 1672786500),
(4, 406, 1672787000),
(4, 407, 1672795000),
(4, 408, 1672795100),
(4, 409, 1672795200),
(4, 410, 1672881600),
(4, 411, 1672881700),
(4, 412, 1672881800),
(4, 413, 1672881900),
(4, 414, 1672882000),
(4, 415, 1672882100);