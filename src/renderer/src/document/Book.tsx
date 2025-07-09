import {
	Page,
	Text,
	View,
	Document,
	StyleSheet,
	Font,
} from '@react-pdf/renderer';
import { useState } from 'react';
import { Message } from '@renderer/lib/types';

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

Font.register({
	family: 'SanFrancisco',
	src: '../assets/SFUIText-Regular.otf',
	fontStyle: 'normal',
	fontWeight: 'normal',
});

Font.registerEmojiSource({
	format: 'png',
	url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/',
});

const styles = StyleSheet.create({
	page: {
		fontFamily: 'Literata',
		padding: 50,
	},
	titlePage: {
		textAlign: 'center',
		fontSize: 12,
		fontFamily: 'Literata',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
	},
	acknowledgementsPage: {
		textAlign: 'center',
		fontSize: 12,
		fontFamily: 'Literata',
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
		paddingBottom: 80,
	},
	dateText: {
		fontSize: 8,
	},
	message: {
		fontFamily: 'SanFrancisco',
		paddingVertical: 20,
		fontSize: 11,
	},
	attachment: {
		fontFamily: 'Courier',
		fontStyle: 'italic',
	},
	meText: {
		textAlign: 'right',
	},
	themText: {
		textAlign: 'left',
	},
	pageNumber: {
		position: 'absolute',
		fontSize: 8,
		bottom: 20,
		right: 20,
	},
	tocEntry: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		paddingVertical: 2,
	},
	tocTitle: {
		fontSize: 11,
	},
	tocDots: {
		flexGrow: 1,
		borderBottomWidth: 0.5,
		borderBottomStyle: 'dotted',
		borderBottomColor: 'black',
		marginHorizontal: 6,
		marginBottom: 3,
	},
	tocPageNumber: {
		fontSize: 11,
	},
});

function Book({
	data,
	messages,
}: {
	data: { authors: string; title: string; acknowledgements: string };
	messages: Message[];
}): React.ReactElement {
	const grouped = groupMessagesByMonth(messages);

	const [ToC, setToC] = useState<{ title: string; page: number }[]>([]);

	function addEntry(title: string, page: number): void {
		setToC((prevToC) => {
			if (prevToC.find((entry) => entry.title === title)) return prevToC;
			return [...prevToC, { title, page }];
		});
	}

	return (
		<Document title={data.title} author={data.authors} creator={data.authors}>
			<Page size="A5" style={[styles.page, styles.titlePage]}>
				<View>
					<Text>{data.title}</Text>
				</View>
			</Page>
			<Page size="A5"></Page>
			<Page size="A5" style={[styles.page, styles.acknowledgementsPage]}>
				<View>
					<Text>{data.acknowledgements}</Text>
				</View>
			</Page>
			<Page size="A5"></Page>
			<Page size="A5" style={[styles.page]}>
				<View>
					<Text>Table of Contents</Text>
					{ToC.sort((a, b) => a.page - b.page).map(
						(entry: { title: string; page: number }, i: number) => (
							<View key={i} style={styles.tocEntry}>
								<Text style={styles.tocTitle}>{entry.title}</Text>
								<View style={styles.tocDots} />
								<Text style={styles.tocPageNumber}>{entry.page}</Text>
							</View>
						)
					)}
				</View>
			</Page>
			{Object.keys(grouped)
				.sort()
				.map((month, i) => (
					<Page size="A5" style={[styles.page, styles.monthPage]} key={i}>
						<Text
							fixed
							render={({ pageNumber }) => pageNumber}
							style={styles.pageNumber}
						/>
						<View>
							<Text
								style={[styles.monthPageTitle]}
								render={({ pageNumber }) => {
									const title = new Intl.DateTimeFormat('en-GB', {
										year: 'numeric',
										month: 'long',
									}).format(new Date(month));
									addEntry(title, pageNumber);
									return title;
								}}
							/>
							{grouped[month].map((message, j) => (
								<View
									key={j}
									wrap={false}
									style={[
										styles.message,
										message.from_me_flag ? styles.meText : styles.themText,
										message.message_text.includes('\ufffc') ?
											styles.attachment
										:	{},
									]}
									minPresenceAhead={100}
								>
									<Text>
										{message.message_text.includes('\ufffc') ?
											'Attachment'
										:	message.message_text}
									</Text>
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
