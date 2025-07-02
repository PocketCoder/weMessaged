import {
	Page,
	Text,
	View,
	Document,
	StyleSheet,
	Font,
} from '@react-pdf/renderer';
import { Message } from '@renderer/lib/types';

Font.register({
	family: 'Literata',
	src: '../assets/Literata/static/Literata-Regular.ttf',
});

Font.register({
	family: 'Literata',
	src: '../assets/Literata/static/Literata-Italic.ttf',
	fontStyle: 'italic',
	fontWeight: 400,
});

Font.registerEmojiSource({
	format: 'png',
	url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/',
});

function groupMessagesByMonth(messages: Message[]): Record<string, Message[]> {
	const grouped: Record<string, Message[]> = {};
	messages.forEach((msg) => {
		const date = new Date(msg.converted_date!);
		const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		if (!grouped[monthYear]) grouped[monthYear] = [];
		grouped[monthYear].push(msg);
	});
	return grouped;
}

const styles = StyleSheet.create({
	page: {
		fontFamily: 'Literata',
		padding: 20,
	},
	acknowledgementsPage: {
		textAlign: 'center',
		fontSize: 12,
		fontStyle: 'italic',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
	},
	monthPage: {},
	monthPageTitle: {
		fontSize: 18,
		textAlign: 'center',
		paddingTop: 60,
		paddingBottom: 100,
	},
	dateText: {
		fontSize: 8,
	},
	message: {
		paddingVertical: 20,
		fontSize: 11,
	},
	meText: {
		textAlign: 'right',
	},
	themText: {
		textAlign: 'left',
	},
});

function Book({
	data,
	messages,
}: {
	data: { authors: string; title: string; acknowledgements: string };
	messages: Message[];
}) {
	const grouped = groupMessagesByMonth(messages);
	console.log(grouped);
	return (
		<Document title={data.title} author={data.authors} creator={data.authors}>
			<Page size="A5" style={[styles.page, styles.acknowledgementsPage]}>
				<View>
					<Text>{data.title}</Text>
					<Text>{data.acknowledgements}</Text>
				</View>
			</Page>
			{Object.keys(grouped).map((month, i) => (
				<Page size="A5" style={[styles.page, styles.monthPage]} key={i}>
					<View>
						<Text style={[styles.monthPageTitle]}>{month}</Text>
						{grouped[month].map((message, j) => (
							<View
								key={j}
								wrap={false}
								style={[
									message.from_me_flag ? styles.meText : styles.themText,
									styles.message,
								]}
							>
								<Text>{message.message_text}</Text>
								<Text style={[styles.dateText]}>
									{new Date(message.converted_date as string).toDateString()}
								</Text>
							</View>
						))}
					</View>
				</Page>
			))}
		</Document>
	);
}

export default Book;
