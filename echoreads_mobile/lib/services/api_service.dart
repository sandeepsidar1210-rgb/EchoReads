import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/book.dart';
import '../models/purchase.dart';

class ApiService {
  ApiService._();

  static final ApiService instance = ApiService._();

  final _client = http.Client();

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final base = Uri.parse(ApiConfig.baseUrl);
    return Uri(
      scheme: base.scheme,
      host: base.host,
      port: base.port,
      path: base.path + path,
      queryParameters: query?.map((k, v) => MapEntry(k, v.toString())),
    );
  }

  Map<String, String> _headers({String? userId}) {
    return {
      'Content-Type': 'application/json',
      if (userId != null) 'x-user-id': userId,
    };
  }

  Future<List<String>> getGenres() async {
    final res = await _client.get(_uri('/genres'));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['success'] != true) {
      throw Exception('Failed to load genres');
    }
    final data = body['data'] as List<dynamic>? ?? [];
    return data.map((e) => e.toString()).toList();
  }

  Future<List<Book>> getBooks({String? genre, String sort = 'latest'}) async {
    final res = await _client.get(
      _uri('/', {
        'sort': sort,
        if (genre != null) 'genre': genre,
      }),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['success'] != true) {
      throw Exception('Failed to load books');
    }
    final list = body['data'] as List<dynamic>? ?? [];
    return list.map((e) => Book.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Book> getBook(String id) async {
    final res = await _client.get(_uri('/$id'));
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['success'] != true) {
      throw Exception('Failed to load book');
    }
    return Book.fromJson(body['data'] as Map<String, dynamic>);
  }

  Future<void> addToCart({
    required String userId,
    required String bookId,
  }) async {
    final res = await _client.post(
      _uri('/cart'),
      headers: _headers(userId: userId),
      body: jsonEncode({'bookId': bookId, 'quantity': 1}),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['success'] != true) {
      throw Exception('Failed to add to cart');
    }
  }

  Future<void> purchase({
    required String userId,
    required String bookId,
    required double price,
  }) async {
    final res = await _client.post(
      _uri('/purchases'),
      headers: _headers(userId: userId),
      body: jsonEncode({'bookId': bookId, 'price': price}),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['success'] != true) {
      throw Exception('Purchase failed');
    }
  }

  Future<List<Purchase>> myPurchases({required String userId}) async {
    final res = await _client.get(
      _uri('/purchases/mine'),
      headers: _headers(userId: userId),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['success'] != true) {
      throw Exception('Failed to load purchases');
    }
    final list = body['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => Purchase.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<String> noviaChat(String message) async {
    final res = await _client.post(
      _uri('/novia/chat'),
      headers: _headers(),
      body: jsonEncode({'message': message}),
    );
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (body['success'] != true) {
      throw Exception('Chat failed');
    }
    return (body['response'] ?? body['data'] ?? '').toString();
  }
}
