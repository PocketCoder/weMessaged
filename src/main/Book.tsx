import {Page, Text, View, Document, StyleSheet, Font, Image} from '@react-pdf/renderer';
import {Message} from '../renderer/src/lib/types';
import EBGaramondRegular from '../../resources/EB_Garamond/static/EBGaramond-Regular.ttf?asset';
import EBGaramondItalic from '../../resources/EB_Garamond/static/EBGaramond-Italic.ttf?asset';

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
	family: 'EB Garamond',
	fonts: [
		{src: EBGaramondRegular, fontStyle: 'normal'},
		{src: EBGaramondItalic, fontStyle: 'italic'}
	]
});

Font.registerEmojiSource({
	format: 'png',
	url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/'
});

const styles = StyleSheet.create({
	page: {
		fontFamily: 'EB Garamond',
		padding: 50
	},
	titlePage: {
		textAlign: 'center',
		fontSize: 12,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	authors: {
		fontSize: 10,
		fontStyle: 'italic'
	},
	acknowledgementsPage: {
		textAlign: 'center',
		fontSize: 12,
		fontStyle: 'italic',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	copyrightPage: {
		textAlign: 'center',
		fontSize: 10,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	monthPage: {},
	monthPageTitle: {
		fontSize: 18,
		textAlign: 'center'
	},
	dateText: {
		paddingTop: 3,
		fontSize: 7
	},
	message: {
		paddingVertical: 20,
		fontSize: 11
	},
	attachment: {
		fontFamily: 'Courier',
		fontStyle: 'italic'
	},
	attachmentImg: {
		width: '30vw',
		alignSelf: 'flex-end'
	},
	meText: {
		textAlign: 'right'
	},
	themText: {
		textAlign: 'left'
	},
	pageNumber: {
		position: 'absolute',
		fontSize: 8,
		bottom: 20,
		right: 20
	},
	tocEntry: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		paddingVertical: 2
	},
	tocTitle: {
		fontSize: 11
	},
	tocPageTitle: {
		paddingTop: 5,
		paddingBottom: 10
	},
	tocDots: {
		flexGrow: 1,
		borderBottomWidth: 0.5,
		borderBottomStyle: 'dotted',
		borderBottomColor: 'black',
		marginHorizontal: 6,
		marginBottom: 3
	},
	tocPageNumber: {
		fontSize: 11
	}
});

function Book({
	data,
	messages
}: {
	data: {authors: string[]; title: string; acknowledgements: string};
	messages: Message[];
}): React.ReactElement {
	const grouped = groupMessagesByMonth(messages);

	const ToC: {title: string; page: number}[] = [];

	const addEntry = (title, page): {title: string; page: number}[] => {
		if (ToC.find((entry) => entry.title === title)) return ToC;
		return [...ToC, {title, page}];
	};

	//console.log(grouped);

	return (
		<Document title={data.title}>
			<Page size="A5" style={[styles.page, styles.titlePage]}>
				<View style={styles.titlePage}>
					<Text>{data.title}</Text>
					<Text style={[styles.authors]}>{`${data.authors[0]}, ${data.authors[1]}`}</Text>
				</View>
			</Page>
			<Page size="A5"></Page>
			<Page size="A5" style={[styles.page, styles.copyrightPage]}>
				<View>
					<Text>
						© {new Date().getFullYear()} {data.authors.join(', ')}
					</Text>
					<Text>All Rights Reserved.</Text>
				</View>
			</Page>
			<Page size="A5"></Page>
			<Page size="A5" style={[styles.page, styles.acknowledgementsPage]}>
				<View>
					<Text>{data.acknowledgements}</Text>
					<Text>— {data.authors[0]}</Text>
				</View>
			</Page>
			<Page size="A5"></Page>
			<Page size="A5" style={[styles.page]}>
				<View>
					<Text style={[styles.tocPageTitle]}>Table of Contents</Text>
					{ToC.sort((a, b) => a.page - b.page).map((entry: {title: string; page: number}, i: number) => (
						<View key={i} style={styles.tocEntry}>
							<Text style={styles.tocTitle}>{entry.title}</Text>
							<View style={styles.tocDots} />
							<Text style={styles.tocPageNumber}>{entry.page + 1}</Text>
						</View>
					))}
				</View>
			</Page>
			{Object.keys(grouped)
				.sort()
				.map((month, i) => (
					<Page size="A5" style={[styles.page, styles.monthPage]} key={i}>
						<Text fixed render={({pageNumber}) => pageNumber} style={styles.pageNumber} />
						<View>
							<Text
								style={[
									styles.monthPageTitle,
									{
										paddingTop: 50,
										paddingBottom: 5,
										borderBottomWidth: '0.5',
										borderBottomColor: 'black',
										width: 40,
										marginHorizontal: 'auto'
									}
								]}>
								{i + 1}
							</Text>
							<Text
								style={[styles.monthPageTitle, {paddingBottom: 50, paddingTop: 10}]}
								render={({pageNumber}) => {
									const title = new Intl.DateTimeFormat('en-GB', {
										year: 'numeric',
										month: 'long'
									}).format(new Date(month));
									addEntry(title, pageNumber);
									return title;
								}}
							/>
							{grouped[month].map((message, j) => (
								<View
									key={j}
									wrap={false}
									style={[styles.message, message.from_me_flag ? styles.meText : styles.themText]}
									minPresenceAhead={100}>
									{message.attachment_uri ? (
										<>
											<Image src={message.attachment_uri} style={[styles.attachmentImg]} />
											<Text>{message.message_text?.replaceAll(`\uFFFC`, '')}</Text>
										</>
									) : message.attachment_path?.includes('.caf') ? (
										<Text>Audio Message</Text>
									) : message.attachment_path?.includes('.MOV') || message.attachment_path?.includes('.mp4') ? (
										<Text>Video Message</Text>
									) : (
										<Text>{message.message_text?.replaceAll(`\uFFFC`, '')}</Text>
									)}
									<Text
										style={[styles.dateText]}
										render={() => {
											const fullDate: Date = new Date(message.converted_date as string);
											const date: string =
												fullDate.getDate() + '/' + (fullDate.getMonth() + 1) + '/' + fullDate.getFullYear();
											const time: string = fullDate.getHours() + ':' + fullDate.getMinutes();
											return date + ' \u2022 ' + time;
										}}
									/>
								</View>
							))}
						</View>
					</Page>
				))}
		</Document>
	);
}

export default Book;
