import {Page, Text, View, Document, StyleSheet, Font, Image} from '@react-pdf/renderer';
//import {useCallback, useState} from 'react';
import {Message} from '../renderer/src/lib/types';

import LiterataRegular from '../../resources/Literata/static/Literata-Regular.ttf?asset';
import LiterataItalic from '../../resources/Literata/static/Literata-Italic.ttf?asset';
import SanFrancisco from '../../resources/SFUIText-Regular.otf?asset';

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
	src: LiterataRegular
});

Font.register({
	family: 'Literata',
	src: LiterataItalic,
	fontStyle: 'italic',
	fontWeight: 400
});

Font.register({
	family: 'SanFrancisco',
	src: SanFrancisco,
	fontStyle: 'normal',
	fontWeight: 'normal'
});

Font.registerEmojiSource({
	format: 'png',
	url: 'https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/'
});

const styles = StyleSheet.create({
	page: {
		fontFamily: 'Literata',
		padding: 50
	},
	titlePage: {
		textAlign: 'center',
		fontSize: 12,
		fontFamily: 'Literata',
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
		fontFamily: 'Literata',
		fontStyle: 'italic',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	copyrightPage: {
		textAlign: 'center',
		fontSize: 10,
		fontFamily: 'Literata',
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	monthPage: {},
	monthPageTitle: {
		fontSize: 18,
		textAlign: 'center',
		paddingTop: 60,
		paddingBottom: 80
	},
	dateText: {
		paddingTop: 3,
		fontSize: 7
	},
	message: {
		fontFamily: 'SanFrancisco',
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
	/*
	const [ToC, setToC] = useState<{title: string; page: number}[]>([]);

	const addEntry = useCallback((title: string, page: number) => {
		setToC((prevToC) => {
			if (prevToC.find((entry) => entry.title === title)) return prevToC;
			return [...prevToC, {title, page}];
		});
	}, []);
*/
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
						&copy; {new Date().getFullYear()} {data.authors.join(', ')}
					</Text>
					<Text>All Rights Reserved.</Text>
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
					<Text style={[styles.tocPageTitle]}>Table of Contents</Text>
					{/*ToC.sort((a, b) => a.page - b.page).map((entry: {title: string; page: number}, i: number) => (
						<View key={i} style={styles.tocEntry}>
							<Text style={styles.tocTitle}>{entry.title}</Text>
							<View style={styles.tocDots} />
							<Text style={styles.tocPageNumber}>{entry.page + 1}</Text>
						</View>
					))*/}
				</View>
			</Page>
			{Object.keys(grouped)
				.sort()
				.map((month, i) => (
					<Page size="A5" style={[styles.page, styles.monthPage]} key={i}>
						<Text fixed render={({pageNumber}) => pageNumber} style={styles.pageNumber} />
						<View>
							<Text
								style={[styles.monthPageTitle]}
								render={() =>
									/*{
										pageNumber
									}*/
									{
										const title = new Intl.DateTimeFormat('en-GB', {
											year: 'numeric',
											month: 'long'
										}).format(new Date(month));
										//addEntry(title, pageNumber);
										return title;
									}
								}
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
											<Text>{message.message_text.replaceAll(`\uFFFC`, '')}</Text>
										</>
									) : message.attachment_path?.includes('.caf') ? (
										<Text>Audio Message</Text>
									) : message.attachment_path?.includes('.MOV') || message.attachment_path?.includes('.mp4') ? (
										<Text>Video Message</Text>
									) : (
										<Text>{message.message_text.replaceAll(`\uFFFC`, '')}</Text>
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
